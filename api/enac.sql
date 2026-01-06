-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 22/12/2025 às 20:02
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `enac`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `cupom`
--

CREATE TABLE `cupom` (
  `id` int(11) NOT NULL,
  `event_id` int(11) DEFAULT NULL,
  `cupom` varchar(50) DEFAULT NULL,
  `percentual` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `cupom`
--

INSERT INTO `cupom` (`id`, `event_id`, `cupom`, `percentual`, `created_at`) VALUES
(1, 1, 'ENAC15', 15.00, '2025-12-17 02:45:19'),
(2, 1, 'ENAC25', 25.00, '2025-12-17 02:45:19');

-- --------------------------------------------------------

--
-- Estrutura para tabela `evento`
--

CREATE TABLE `evento` (
  `id` int(11) NOT NULL,
  `uuid` char(36) NOT NULL,
  `nome_evento` varchar(500) DEFAULT NULL,
  `nome_reduzido` varchar(200) DEFAULT NULL,
  `data_inicio_inscricoes` date DEFAULT NULL,
  `data_fim_inscricoes` date DEFAULT NULL,
  `data_evento` date DEFAULT NULL,
  `valor_periodo` decimal(10,2) DEFAULT NULL,
  `valor_fora_periodo` decimal(10,2) DEFAULT NULL,
  `taxa_inscricao` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `evento`
--

INSERT INTO `evento` (`id`, `uuid`, `nome_evento`, `nome_reduzido`, `data_inicio_inscricoes`, `data_fim_inscricoes`, `data_evento`, `valor_periodo`, `valor_fora_periodo`, `taxa_inscricao`, `created_at`, `updated_at`) VALUES
(1, '605c2d08-af97-413d-acde-1055963bc18a', 'Enac 2026', 'Enac 2026', '2025-12-01', '2026-01-10', '2026-02-01', 750.00, 850.00, 100.00, '2025-12-19 19:02:28', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `inscricoes`
--

CREATE TABLE `inscricoes` (
  `id` int(11) NOT NULL,
  `uuid` char(36) NOT NULL,
  `event_id` int(11) DEFAULT NULL,
  `participante_id` int(11) NOT NULL,
  `modalitie` int(11) DEFAULT 0,
  `translado` int(11) DEFAULT NULL,
  `tipo` int(11) DEFAULT NULL,
  `grupo_mentoria` int(11) DEFAULT NULL,
  `restricoes_alimentares` varchar(1500) DEFAULT NULL,
  `termo` varchar(1) DEFAULT 'N',
  `status` enum('em_andamento','finalizada','cancelada') DEFAULT 'em_andamento',
  `valor_original` decimal(10,2) DEFAULT NULL,
  `cupom` int(11) DEFAULT NULL,
  `desconto` decimal(10,2) DEFAULT NULL,
  `taxa` decimal(10,2) DEFAULT NULL,
  `liquido` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `dependente` varchar(1) DEFAULT 'N',
  `nome_inscrito` varchar(300) DEFAULT NULL,
  `nascimento` date DEFAULT NULL,
  `deleted` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `inscricoes`
--

INSERT INTO `inscricoes` (`id`, `uuid`, `event_id`, `participante_id`, `modalitie`, `translado`, `tipo`, `grupo_mentoria`, `restricoes_alimentares`, `termo`, `status`, `valor_original`, `cupom`, `desconto`, `taxa`, `liquido`, `created_at`, `updated_at`, `dependente`, `nome_inscrito`, `nascimento`, `deleted`) VALUES
(41, '002c5255-dcdd-43a5-b69e-76171c28a13c', 1, 21, 0, 0, 1, 4, 'aafdasfsdfsfsdfsdfsdasdfasdf', '1', 'em_andamento', 750.00, 2, 187.50, NULL, 562.50, '2025-12-18 11:13:49', '2025-12-22 13:46:48', 'N', 'Marcos Leandro Silva', '1996-06-09', 0),
(42, '74137bf8-bda0-4e04-9ffd-4dda45439dcd', 1, 21, 1, NULL, NULL, NULL, NULL, NULL, 'em_andamento', 0.00, NULL, 0.00, NULL, 0.00, '2025-12-18 11:14:09', '2025-12-22 13:46:48', 'N', 'Criança 4 anos', '2018-01-01', 1),
(43, 'b27d0277-2296-4d9f-85f7-c16c4cf36ef6', 1, 21, 2, NULL, NULL, NULL, NULL, NULL, 'em_andamento', 750.00, NULL, 375.00, NULL, 375.00, '2025-12-18 11:14:46', '2025-12-22 13:46:48', 'N', 'Criança de 4 a 9', '2025-01-01', 1),
(44, 'e801c7ae-716d-47a3-9c80-79638bde0ea6', 1, 21, 1, NULL, NULL, NULL, NULL, NULL, 'em_andamento', 0.00, NULL, 0.00, NULL, 0.00, '2025-12-18 11:15:07', '2025-12-22 13:46:48', 'N', 'Teste Criança até 4', '2000-01-01', 1),
(45, 'de11f94e-7a79-43cd-9705-7243deb2605a', 1, 21, 1, NULL, NULL, NULL, NULL, NULL, 'em_andamento', 0.00, NULL, 0.00, NULL, 0.00, '2025-12-19 13:53:57', '2025-12-22 13:46:48', 'N', 'Heitor Bani', '2018-01-01', 0),
(46, '0715619b-a073-4a2c-b46c-c4acb2285332', 1, 21, 2, NULL, NULL, NULL, NULL, NULL, 'em_andamento', 750.00, NULL, 375.00, NULL, 375.00, '2025-12-19 13:54:30', '2025-12-22 13:46:48', 'N', 'Manuella', '2025-01-01', 0),
(47, '10e1d6a3-9280-4aec-a69c-7d06b0fb4d82', 1, 21, 0, 0, 1, 4, 'sadsadsdad', '1', 'em_andamento', 750.00, NULL, 0.00, NULL, 750.00, '2025-12-19 14:14:37', '2025-12-22 13:46:48', 'N', 'Ivy Bani Ramos', '1997-09-09', 0),
(48, 'b6f7b658-5179-4f94-9252-801630bb1d8f', 1, 21, 1, NULL, NULL, NULL, NULL, NULL, 'em_andamento', 0.00, NULL, 0.00, NULL, 0.00, '2025-12-19 15:08:02', '2025-12-22 13:46:48', 'N', 'Teste Criança até 4', '2025-12-19', 1),
(49, '606a933d-9228-4e7b-8678-c47de8db2f49', 1, 21, 2, NULL, NULL, NULL, NULL, NULL, 'em_andamento', 750.00, NULL, 375.00, NULL, 375.00, '2025-12-19 15:31:13', '2025-12-22 13:46:48', 'N', 'Teste Criança até 4', '2018-01-01', 0),
(50, '283c9623-8101-4e76-84b2-5f51e87b60d1', 1, 21, 0, 0, 0, 0, '', '1', 'em_andamento', 750.00, NULL, 0.00, NULL, 750.00, '2025-12-19 15:52:07', '2025-12-22 13:46:48', 'N', 'Marcos Leandro Silva', '2000-01-01', 0),
(51, '7b1c843c-aa18-4580-b625-3bbdeabe60b4', 1, 21, 0, 0, 1, 2, 'asasdadsdasd', '1', 'em_andamento', 750.00, NULL, 0.00, NULL, 750.00, '2025-12-22 13:45:47', '2025-12-22 13:45:47', 'N', 'Kaic', '2000-01-01', 0),
(52, 'f8e29013-4cad-42f1-ab99-a147b42847cb', 1, 22, 0, 0, 1, 2, 'sadsdadsdsad', '1', 'em_andamento', 750.00, 1, 112.50, NULL, 637.50, '2025-12-22 13:49:34', '2025-12-22 13:49:34', 'N', 'Teste Novo Responsavel', '1999-01-01', 0);

-- --------------------------------------------------------

--
-- Estrutura para tabela `participante`
--

CREATE TABLE `participante` (
  `id` int(11) NOT NULL,
  `uuid` char(36) NOT NULL,
  `cpf` char(64) DEFAULT NULL,
  `nome` varchar(250) DEFAULT NULL,
  `nascimento` date DEFAULT NULL,
  `cidade` varchar(150) DEFAULT NULL,
  `estado` varchar(10) DEFAULT NULL,
  `email` varchar(250) DEFAULT NULL,
  `telefone` varchar(50) DEFAULT NULL,
  `status` varchar(1) DEFAULT 'N',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `participante`
--

INSERT INTO `participante` (`id`, `uuid`, `cpf`, `nome`, `nascimento`, `cidade`, `estado`, `email`, `telefone`, `status`, `created_at`, `updated_at`) VALUES
(21, 'dd6e08f3-d080-48cc-b6d1-2b3073fcb929', '02290436666', 'Marcos Leandro Silva', '1996-06-09', '32998373640', 'Minas Gera', 'marcosadmleandro@gmail.com', '32998373640', 'S', '2025-12-18 14:12:57', '2025-12-18 14:13:49'),
(22, '0081a9a3-f4d6-4a07-873b-8435d7524626', '69810217064', 'Teste Novo Responsavel', '1999-01-01', '3298989898', 'MG', 'a@teste.com', '3298989898', 'S', '2025-12-22 16:48:50', '2025-12-22 16:49:34');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario`
--

CREATE TABLE `usuario` (
  `id` int(11) NOT NULL,
  `uuid` char(36) NOT NULL,
  `usuario` varchar(200) DEFAULT NULL,
  `senha` varchar(200) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuario`
--

INSERT INTO `usuario` (`id`, `uuid`, `usuario`, `senha`, `created_at`, `updated_at`) VALUES
(1, 'a0325c00-0765-43f4-aa5e-d6aba67d4741', 'Admin', '$2y$10$Rd96ZnUKorYVEZu/3EdlyegM.oem0WxfudKXt1abE2C4U7LBPHMCS', '2025-12-19 19:27:00', NULL);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `cupom`
--
ALTER TABLE `cupom`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evento_cupom` (`event_id`);

--
-- Índices de tabela `evento`
--
ALTER TABLE `evento`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `inscricoes`
--
ALTER TABLE `inscricoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_token` (`uuid`),
  ADD KEY `participante_inscricao` (`participante_id`),
  ADD KEY `cupom_inscricao` (`cupom`),
  ADD KEY `event_inscricao` (`event_id`);

--
-- Índices de tabela `participante`
--
ALTER TABLE `participante`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `cupom`
--
ALTER TABLE `cupom`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `evento`
--
ALTER TABLE `evento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `inscricoes`
--
ALTER TABLE `inscricoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT de tabela `participante`
--
ALTER TABLE `participante`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de tabela `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `cupom`
--
ALTER TABLE `cupom`
  ADD CONSTRAINT `evento_cupom` FOREIGN KEY (`event_id`) REFERENCES `evento` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `inscricoes`
--
ALTER TABLE `inscricoes`
  ADD CONSTRAINT `cupom_inscricao` FOREIGN KEY (`cupom`) REFERENCES `cupom` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `event_inscricao` FOREIGN KEY (`event_id`) REFERENCES `evento` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `participante_inscricao` FOREIGN KEY (`participante_id`) REFERENCES `participante` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
